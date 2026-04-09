# B.KICK - ESG Reporting Platform

Plataforma modular e customizável para gestão de sustentabilidade corporativa.

---

## 🚀 Últimas Atualizações e Funcionalidades (Desenvolvimento)

Este documento sumariza as recentes implementações de UI/UX, arquitetura e lógica de dados aplicadas à plataforma.

### 1. Nova Landing Page Integrada

- **Design System:** Implementação da nova interface pública focada na estética "Zinc-Black" (Dark Mode premium).
- **Roteamento:** Otimização dos _Call to Actions_ utilizando roteamento client-side limpo para transições sem recarregamento de página.

### 2. Módulo Kanban (Central de Visão)

- **Gestão Ágil:** Implementação da interface Kanban para acompanhamento visual de tarefas, respostas e fluxos da jornada ESG das empresas.

### 3. Barra de Progresso Dinâmica (Sidebar)

- **Lógica Real:** Remoção de dados estáticos/mockados. O progresso geral agora reflete 100% o status real do banco de dados.
- **Backend Analytics:** Nova rota de API (`/api/progress/route.ts`) processando dados do Supabase.
- **Correção de Granularidade:** Algoritmo refatorado para deduplicar cálculos de relacionamento (Template vs. Empresa), aplicando trava matemática e filtrando os resultados com base nas permissões (role) do usuário logado.

### 4. Nova Rota: "Solicitar Demonstração"

- **Página Dedicada:** Criação da rota `/solicitar-demonstracao` conectada à Landing Page.
- **Componentização:** Formulário interativo construído com validações de estado e `Toasts` de feedback visual.
- **Isolamento de Contexto:** Configuração no wrapper principal para ocultar a Sidebar interna do sistema em rotas públicas de marketing.

### 5. Padronização da Identidade Visual (Logos)

- **Fidelidade da Marca:** Correção profunda de CSS (remoção de `filter: invert` indesejados) que corrompiam a cor primária (Verde) da marca.
- **Alternância de Tema:** Implementação da troca de assets via Tailwind (`dark:hidden` / `hidden dark:block`) para suportar corretamente fundos claros e escuros.
- **Escopo:** Telas de Login (Desktop/Mobile) e cabeçalho da AppSidebar perfeitamente padronizados com o design original.

---

## 💻 Stack Tecnológica

- **Front-end:** Next.js (App Router), React, TypeScript.
- **Estilização & UI:** Tailwind CSS, shadcn/ui.
- **BaaS & Backend:** Supabase, integrações FastAPI...
