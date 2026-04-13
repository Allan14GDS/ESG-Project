"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";


const navLinks = [
  { label: "Sobre", href: "#sobre" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Jornada ESG", href: "#jornada" },
  { label: "Metodologias", href: "#metodologias" },
  { label: "Contato", href: "#contato" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="relative sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
        <Link href="/" className="flex items-center">
          <img src="/assets/logo-light.png" alt="B.Kick" className="h-8 dark:hidden" />
          <img src="/assets/logo-dark.png" alt="B.Kick" className="h-8 hidden dark:block" />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/auth/login">
            <Button className="rounded-full px-6 font-semibold">
              Fazer Login
            </Button>
          </Link>
        </div>

        {/* ThemeToggle fixo no canto direito — desktop */}
        <div className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2">
          <ThemeToggle />
        </div>

        <div className="md:hidden flex items-center gap-1">
          <ThemeToggle />
          <button
            className="p-2"
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

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {/* O mesmo link para a versão mobile */}
          <Link href="/auth/login" className="block mt-2">
            <Button className="w-full rounded-full font-semibold">
              Fazer Login
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
