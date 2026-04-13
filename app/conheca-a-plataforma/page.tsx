import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { HeroProduct } from "@/components/conheca-plataforma/HeroProduct"
import { QuickBenefits } from "@/components/conheca-plataforma/QuickBenefits"
import { FeatureBlock } from "@/components/conheca-plataforma/FeatureBlock"
import { CtaBanner } from "@/components/conheca-plataforma/CtaBanner"

export const metadata = {
  title: "Conheça a Plataforma | B.KICK ESG",
  description:
    "Descubra como a B.KICK simplifica a gestão ESG, o controle de cadernos GRI e a geração de relatórios para holdings e empresas.",
}

export default function ConhecaAPlataformaPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, hsl(220, 30%, 12%) 0%, hsl(220, 28%, 16%) 40%, hsl(180, 20%, 14%) 70%, hsl(153, 25%, 14%) 100%)",
      }}
    >
      {/* Mini nav bar */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 pb-2 flex flex-col items-center gap-3">
        <Link href="/">
          <Image
            src="/assets/logo-dark.png"
            alt="B.KICK"
            width={90}
            height={28}
            className="h-7 w-auto"
          />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-white/45 hover:text-white/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o início
        </Link>
      </div>

      <main id="funcionalidades">
        <HeroProduct />

        <QuickBenefits />

        <FeatureBlock
          badge="Controle Operacional"
          title="Visão Kanban para Status Operacional"
          description="Acompanhe o andamento de cada rodada de relatórios em um quadro visual e intuitivo. Saiba exatamente onde cada caderno está — do início à validação final."
          bullets={[
            "Colunas de status: Não Iniciado, Rascunho, Submetido, Devolvido e Validado",
            "Filtros por categoria, responsável e busca por título do caderno",
            "Taxa de conclusão geral com indicador de progresso visual",
            "Acesso rápido ao caderno GRI diretamente pelo card",
          ]}
          imageSrc="/assets/screenshots/kanban-status.png"
          imageAlt="Painel de Status Operacional com progresso da rodada 2025"
          secondImageSrc="/assets/screenshots/kanban-board.png"
          secondImageAlt="Quadro Kanban de Disclosures GRI com colunas de status"
        />

        <FeatureBlock
          badge="Geração de Relatórios"
          title="Exportação Descomplicada"
          description="Gere relatórios PDF completos com as seções GRI que você precisa. Selecione, revise o status de cada seção e exporte com um clique."
          bullets={[
            "Seleção granular: Sumário Executivo, Disclosures GRI, Dados de Funcionários e mais",
            "Resumo do status de preenchimento antes de exportar",
            "Formatos disponíveis: PDF Completo, Excel e outros",
            "Compatível com o padrão GRI 2021",
          ]}
          imageSrc="/assets/screenshots/export.png"
          imageAlt="Tela de exportação de relatório ESG com seções GRI selecionáveis na plataforma B.KICK"
        />

        <CtaBanner />
      </main>
    </div>
  )
}
