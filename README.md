# 🌱 B.KICK (GRI 2 ESG App) - Plataforma de Governança ESG

🔗 **Acesse o projeto em produção:** [bkick.com.br](https://www.bkick.com.br/)

O B.KICK é uma plataforma SaaS robusta de gestão ESG (Environmental, Social, Governance) desenvolvida para orquestrar a coleta, revisão e exportação de métricas baseadas no padrão global GRI. O sistema foi projetado com uma arquitetura multi-tenant complexa, permitindo organizar empresas em holdings e administrar o preenchimento de cadernos de questões por diferentes respondentes sob rígidas regras de governança.

## 🛠️ Tecnologias Principais

A stack tecnológica foi escolhida para garantir performance, segurança de dados (RLS) e fluidez na interface:

*   **Frontend**: Next.js 14 (App Router), React, TypeScript.
*   **Backend**: Next.js Server Actions, Supabase (PostgreSQL).
*   **UI/UX**: Tailwind CSS, shadcn/ui. Layouts refinados e implementação avançada de estados de componentes para uma navegação sem atritos.
*   **Autenticação**: Supabase Auth.
*   **Database**: Supabase (PostgreSQL com Row Level Security).

## 🏛️ Arquitetura de Banco de Dados e Multi-Tenancy

O grande diferencial técnico do B.KICK é a sua modelagem de dados flexível e escalável:

*   **Organizações Híbridas**: Em vez de tabelas rígidas separadas, o sistema utiliza uma entidade central de `organizations`. Holdings e empresas (companies) coexistem na mesma tabela, diferenciadas pelo tipo e conectadas via referências UUID (`holding_id`), permitindo uma escalabilidade infinita de hierarquias corporativas.
*   **Governança via Junção**: O controle de acesso é orquestrado pela tabela chave `organization_members`. Essa arquitetura permite que um único usuário possua múltiplas permissões em diferentes organizações de forma simultânea.

## ✨ Funcionalidades Core (Governança e Fluxos)

*   **Controle de Acesso Baseado em Perfis (RBAC)**: O sistema suporta 6 níveis de hierarquia rigorosa, desde o `admin_main` (acesso total), passando por gestores de holding (`holding_admin`), até revisores e respondentes de dados operacionais.
*   **Sistema de Status e Auditoria**: Cada resposta inserida na plataforma transita por um fluxo de aprovação customizado (`rascunho`, `aguardando_revisao`, `revisao`, `aprovado`). Gestores utilizam um *Review Panel* para aprovar ou solicitar ajustes. Todas as ações são gravadas em uma tabela de `comment_history`.
*   **Banco de Questões Dinâmico**: Criação de templates de cadernos ESG globais reutilizáveis, onde as respostas complexas são armazenadas utilizando o poder do `JSONB` no PostgreSQL.
*   **Subsistema de Conteúdo Integrado**: Além das métricas, a plataforma conta com uma estrutura otimizada de blog e painel de informações, centralizando a comunicação ESG.

## 🚀 Fluxo de Trabalho (Onboarding)

O fluxo principal orquestra a entrada de corporações complexas:

1.  Criação da Holding e de suas respectivas Companies.
2.  Atribuição de Templates de Cadernos específicos para cada empresa (`company_templates`).
3.  Designação de Gestores e Respondentes, limitando a visualização de dados estritamente às organizações permitidas (via RLS e queries protegidas).
