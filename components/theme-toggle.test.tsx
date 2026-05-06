import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ThemeToggle } from "./theme-toggle";

// ─── Module Mocks ─────────────────────────────────────────────────────────────

const mockSetTheme = vi.hoisted(() => vi.fn());
// Objeto mutável: permite alterar o tema entre testes sem reconfigurar o mock.
const mockThemeState = vi.hoisted(() => ({ resolvedTheme: "light" as string }));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: mockThemeState.resolvedTheme,
    setTheme: mockSetTheme,
  }),
}));

vi.mock("lucide-react", () => ({
  Moon: () => <svg data-testid="moon-icon" aria-hidden="true" />,
  Sun: () => <svg data-testid="sun-icon" aria-hidden="true" />,
}));

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockSetTheme.mockClear();
  mockThemeState.resolvedTheme = "light";
});

// ─── Test Suites ──────────────────────────────────────────────────────────────

// ── 1. Estado inicial — modo claro ────────────────────────────────────────────

describe("estado inicial — modo claro (light)", () => {
  it("deve renderizar o botão de toggle acessível", () => {
    render(<ThemeToggle />);
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
  });

  it("deve ter aria-label informando a ação de ativar o modo escuro", () => {
    render(<ThemeToggle />);
    expect(screen.getByLabelText("Ativar modo escuro")).toBeInTheDocument();
  });

  it("deve exibir o ícone de Lua no modo claro (para acionar o dark)", () => {
    render(<ThemeToggle />);
    expect(screen.getByTestId("moon-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("sun-icon")).not.toBeInTheDocument();
  });
});

// ── 2. Estado inicial — modo escuro ──────────────────────────────────────────

describe("estado inicial — modo escuro (dark)", () => {
  beforeEach(() => {
    mockThemeState.resolvedTheme = "dark";
  });

  it("deve ter aria-label informando a ação de ativar o modo claro", () => {
    render(<ThemeToggle />);
    expect(screen.getByLabelText("Ativar modo claro")).toBeInTheDocument();
  });

  it("deve exibir o ícone de Sol no modo escuro (para acionar o light)", () => {
    render(<ThemeToggle />);
    expect(screen.getByTestId("sun-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("moon-icon")).not.toBeInTheDocument();
  });
});

// ── 3. Comportamento do toggle ────────────────────────────────────────────────

describe("comportamento do toggle — clique", () => {
  it("deve chamar setTheme('dark') ao clicar no modo claro", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByTestId("theme-toggle"));

    expect(mockSetTheme).toHaveBeenCalledTimes(1);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("deve chamar setTheme('light') ao clicar no modo escuro", () => {
    mockThemeState.resolvedTheme = "dark";
    render(<ThemeToggle />);
    fireEvent.click(screen.getByTestId("theme-toggle"));

    expect(mockSetTheme).toHaveBeenCalledTimes(1);
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("não deve chamar setTheme antes de qualquer clique", () => {
    render(<ThemeToggle />);
    expect(mockSetTheme).not.toHaveBeenCalled();
  });

  it("deve registrar exatamente um clique por interação", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByTestId("theme-toggle"));
    fireEvent.click(screen.getByTestId("theme-toggle"));

    expect(mockSetTheme).toHaveBeenCalledTimes(2);
  });
});
