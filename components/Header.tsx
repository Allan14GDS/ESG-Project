"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { label: "Sobre", href: "/#sobre" },
  { label: "Funcionalidades", href: "/#funcionalidades" },
  { label: "Jornada ESG", href: "/#jornada" },
  { label: "Metodologias", href: "/#metodologias" },
  { label: "Contato", href: "/#contato" },
  { label: "Blog", href: "/blog" },
];

const NAV_LINK_CLASS =
  "text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors duration-200";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800">
      {/* Wrapper full-width para que o ThemeToggle possa encostar na borda direita */}
      <div className="flex items-center h-16">

        {/* Container centralizado: Logo + Nav + Login */}
        <div className="container mx-auto flex items-center justify-between h-full px-4 lg:px-8">

          {/* ── Esquerda: Logo ──────────────────────────────────────── */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img src="/assets/logo-light.png" alt="B.Kick" className="h-8 dark:hidden" />
              <img src="/assets/logo-dark.png" alt="B.Kick" className="h-8 hidden dark:block" />
            </Link>
          </div>

          {/* ── Centro: links de navegação (desktop) ────────────────── */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={NAV_LINK_CLASS}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ── Direita (desktop): botão de login ───────────────────── */}
          <div className="hidden md:flex items-center">
            <Link href="/auth/login">
              <Button className="rounded-full px-6 font-semibold bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white">
                Fazer Login
              </Button>
            </Link>
          </div>

          {/* ── Mobile: hamburger ───────────────────────────────────── */}
          <div className="md:hidden flex items-center gap-1">
            <button
              className="p-2 text-zinc-600 dark:text-zinc-400"
              aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* ── ThemeToggle fora do container — borda direita absoluta ── */}
        <div className="flex items-center pr-4">
          <ThemeToggle />
        </div>

      </div>

      {/* ── Menu mobile expandido ─────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block ${NAV_LINK_CLASS}`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/auth/login" className="block mt-2">
            <Button className="w-full rounded-full font-semibold bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white">
              Fazer Login
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
